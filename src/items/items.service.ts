import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GetItemsFilterDto } from './dto/get-item.dto';
const Fuse = require('fuse.js');

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async getItems(filterDto: GetItemsFilterDto) {
    const where: any = {};

    this.applyFloatFilter(where, filterDto.floatMin, filterDto.floatMax);
    this.applyPriceFilter(where, filterDto.priceMin, filterDto.priceMax);
    this.applyCategoryFilter(where, filterDto.category);

    const items = await this.prisma.item.findMany({ where });

    if (filterDto.name) {
      const fuse = new Fuse(items, {
        keys: ['name'],
        threshold: 0.3,
      });

      const result = fuse.search(filterDto.name);
      return result.map(res => res.item);
    }

    return items;
  }

  private applyFloatFilter(where: any, floatMin?: number, floatMax?: number) {
    if (floatMin && floatMax && floatMin > floatMax) {
      throw new Error('floatMin cannot be greater than floatMax');
    }

    if (floatMin || floatMax) {
      where.float = {
        gte: floatMin || undefined,
        lte: floatMax || undefined,
      };
    }
  }

  private applyPriceFilter(where: any, priceMin?: number, priceMax?: number) {
    if (priceMin && priceMax && priceMin > priceMax) {
      throw new Error('priceMin cannot be greater than priceMax');
    }

    const min = priceMin ? Number(priceMin) : undefined;
    const max = priceMax ? Number(priceMax) : undefined;

    if (min || max) {
      where.price = {
        gte: min || undefined,
        lte: max || undefined,
      };
    }
  }

  private applyCategoryFilter(where: any, category?: string) {
    if (category) where.category = category;
  }
}
