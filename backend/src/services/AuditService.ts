import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../lib/prisma.js';

export interface AuditLogParams {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Records an immutable audit log entry.
   * Can be passed an ongoing Prisma transaction client (`tx`) to ensure atomic writes.
   */
  static async log(
    params: AuditLogParams,
    dbClient: PrismaClient | Prisma.TransactionClient = defaultPrisma
  ) {
    try {
      const entry = await dbClient.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          metadata: params.metadata ?? {},
          ip: params.ip,
          userAgent: params.userAgent,
        },
      });
      return entry;
    } catch (error) {
      console.error('AuditLog writing failed:', error);
      // In critical transactions, failure to audit should bubble up to prevent un-audited state mutation
      throw new Error(`Audit logging failed for action: ${params.action}`);
    }
  }

  /**
   * Retrieves audit logs with optional filtering.
   */
  static async queryLogs(filters: {
    actorId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [total, logs] = await Promise.all([
      defaultPrisma.auditLog.count({ where }),
      defaultPrisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return { total, logs };
  }
}

