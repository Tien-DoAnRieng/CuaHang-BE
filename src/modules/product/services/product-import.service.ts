import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import * as iconv from 'iconv-lite';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Category } from '../../../shared/schemas/entities/category.entity';
import { ProductService } from './product.service';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { Color } from '../../../shared/schemas/entities/color.entity';
import { Size } from '../../../shared/schemas/entities/size.entity';
import { ProductImage } from '../../../shared/schemas/entities/product-image.entity';

@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
    @InjectRepository(Color) private colorRepo: Repository<Color>,
    @InjectRepository(Size) private sizeRepo: Repository<Size>,
    @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
    private productService: ProductService,
  ) {}

  /**
   * Parse an uploaded Excel/CSV buffer and import rows synchronously.
   * Returns a summary with counts and per-row errors.
   */
  // Accept Multer file so we can detect originalname / mimetype and handle CSV encoding
  async importFromFile(file: Express.Multer.File) {
    const original = file.originalname || '';
    const lower = original.toLowerCase();

    let workbook: XLSX.WorkBook | null = null;

    if (lower.endsWith('.csv') || file.mimetype === 'text/csv' || lower.endsWith('.txt')) {
      // Try several encodings commonly used for Vietnamese CSV files and others
      const encodings = ['utf8', 'utf8bom', 'utf16le', 'windows-1258', 'win1258', 'cp1258', 'latin1', 'binary'];
      let csvString: string | null = null;
      for (const enc of encodings) {
        try {
          if (enc === 'utf8bom') {
            csvString = iconv.decode(file.buffer, 'utf8');
            if (csvString && csvString.charCodeAt(0) === 0xfeff) csvString = csvString.slice(1);
          } else {
            // iconv-lite accepts many aliases; pass through encoding name
            csvString = iconv.decode(file.buffer, enc as any);
          }

          if (!csvString) continue;

          // Try to build a workbook from the decoded CSV string; accept this encoding only if parsing yields at least one sheet
          try {
            const wb = XLSX.read(csvString, { type: 'string' });
            if (wb && Array.isArray(wb.SheetNames) && wb.SheetNames.length > 0) {
              workbook = wb;
              this.logger.log(`Detected CSV encoding: ${enc}`);
              break;
            }
          } catch (innerErr) {
            // parsing failed for this encoding, try next
            continue;
          }
        } catch (err) {
          // try next encoding
          csvString = null;
          continue;
        }
      }
      if (!workbook) throw new Error('Unable to decode CSV file with supported encodings');
    } else {
      // Assume xlsx or similar binary format
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    }

    if (!workbook) throw new Error('Failed to build workbook from uploaded file');

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    const summary = {
      total: raw.length,
      created: 0,
      updated: 0,
      errors: [] as Array<{ row: number; message: string }> ,
    };

    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      const rowNum = i + 2; // header row assumed at 1

      try {
        const name = (row.name || row['Name'] || row['product_name'] || '').toString().trim();
        const priceRaw = (row.price || row['Price'] || row['product_price'] || '').toString().trim();
        if (!name) throw new Error('Missing product name');
        if (!priceRaw) throw new Error('Missing price');
        const price = Number(priceRaw);
        if (Number.isNaN(price)) throw new Error('Invalid price');

        const description = (row.description || row['Description'] || '').toString().trim();
        const brand = (row.brand || row['Brand'] || '').toString().trim() || 'Unknown';
        const categoryName = (row.category || row['Category'] || '').toString().trim();
        const status = (row.status || row['Status'] || 'ACTIVE').toString().trim();

        // find or create category; if none provided create/find 'Uncategorized'
        let categoryId: string | undefined = undefined;
        if (categoryName) {
          let cat = await this.categoryRepo.findOne({ where: { name: categoryName } });
          if (!cat) {
            cat = this.categoryRepo.create({ name: categoryName });
            cat = await this.categoryRepo.save(cat);
          }
          categoryId = cat.id;
        } else {
          // ensure product has a category (product.category_id is non-nullable in schema)
          let defaultCat = await this.categoryRepo.findOne({ where: { name: 'Uncategorized' } });
          if (!defaultCat) {
            defaultCat = this.categoryRepo.create({ name: 'Uncategorized' });
            defaultCat = await this.categoryRepo.save(defaultCat);
          }
          categoryId = defaultCat.id;
        }

        // attempt to find existing product by name+brand
        let product: Product | null = null;
        const existing = await this.productRepo.findOne({ where: { name, brand }, relations: ['category'] });

        if (existing) {
          existing.name = name;
          existing.description = description;
          existing.price = price;
          existing.brand = brand;
          existing.status = status;
          if (categoryName && categoryId) {
            const catEntity = await this.categoryRepo.findOne({ where: { id: categoryId } });
            if (catEntity) existing.category = catEntity;
          }
          product = await this.productRepo.save(existing);
          summary.updated++;
        } else {
          const payload: any = { name, description, price, brand, status };
          if (categoryId) payload.category = categoryId;
          product = await this.productService.create(payload as any);
          summary.created++;
        }
        // --- Variant handling (use color+size composite) ---
        const variantColorName = (row.variant_color || row['variant_color'] || '').toString().trim();
        const variantSizeName = (row.variant_size || row['variant_size'] || '').toString().trim();
        const variantPriceRaw = (row.variant_price || row['variant_price'] || '').toString().trim();
        const variantStockRaw = (row.variant_stock || row['variant_stock'] || '').toString().trim();

        if ((variantColorName || variantSizeName) && product) {
          // color
          let color: Color | null = null;
          if (variantColorName) {
            color = await this.colorRepo.findOne({ where: { name: variantColorName } });
            if (!color) {
              color = this.colorRepo.create({ name: variantColorName, hexCode: '#000000' });
              color = await this.colorRepo.save(color);
            }
          }

          // size
          let size: Size | null = null;
          if (variantSizeName) {
            size = await this.sizeRepo.findOne({ where: { name: variantSizeName } });
            if (!size) {
              size = this.sizeRepo.create({ name: variantSizeName });
              size = await this.sizeRepo.save(size);
            }
          }

          const colorId = color ? color.id : undefined;
          const sizeId = size ? size.id : undefined;

          const where: any = { productId: product.id };
          if (colorId) where.colorId = colorId;
          if (sizeId) where.sizeId = sizeId;

          let variant = await this.variantRepo.findOne({ where });
          const parsedStock = variantStockRaw ? Number(variantStockRaw) : undefined;
          const parsedPrice = variantPriceRaw ? Number(variantPriceRaw) : undefined;

          if (variant) {
            if (parsedStock !== undefined && !Number.isNaN(parsedStock)) variant.stockQuantity = parsedStock;
            if (parsedPrice !== undefined && !Number.isNaN(parsedPrice)) variant.priceOverride = parsedPrice;
            await this.variantRepo.save(variant);
          } else {
            const v: any = {
              productId: product.id,
              colorId: colorId,
              sizeId: sizeId,
              stockQuantity: parsedStock || 0,
              priceOverride: parsedPrice || null,
            };
            const newV = this.variantRepo.create(v);
            await this.variantRepo.save(newV);
          }
        }

        // --- Images handling (comma-separated URLs) ---
        const imagesRaw = (row.image_urls || row['image_urls'] || '').toString().trim();
        if (imagesRaw && product) {
          const urls = imagesRaw.split(',').map((s: string) => s.trim()).filter((s: string) => !!s);
          for (let idx = 0; idx < urls.length; idx++) {
            const url = urls[idx];
            // avoid duplicate image records for same product+url
            const exists = await this.imageRepo.findOne({ where: { productId: product.id, imageUrl: url } });
            if (exists) continue;
            const img = this.imageRepo.create({ productId: product.id, imageUrl: url, isMain: idx === 0 });
            await this.imageRepo.save(img);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Row ${rowNum} import error: ${err.message}`);
        summary.errors.push({ row: rowNum, message: err.message || 'Unknown error' });
      }
    }

    return summary;
  }
}
