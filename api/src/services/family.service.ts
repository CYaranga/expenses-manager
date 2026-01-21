import type { Family, FamilyMember, CreateFamilyRequest, UpdateFamilyRequest } from '../../../shared/src';
import { generateId, getCurrentTimestamp, generateInviteCode } from '../utils';

export class FamilyService {
  constructor(private db: D1Database) {}

  async create(userId: string, data: CreateFamilyRequest): Promise<Family> {
    const familyId = generateId();
    const timestamp = getCurrentTimestamp();
    const inviteCode = generateInviteCode();

    await this.db
      .prepare(
        `INSERT INTO families (id, name, invite_code, admin_id, description, currency, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        familyId,
        data.name,
        inviteCode,
        userId,
        data.description || null,
        data.currency || 'USD',
        timestamp,
        timestamp
      )
      .run();

    // Update user to be admin of this family
    await this.db
      .prepare('UPDATE users SET family_id = ?, role = ? WHERE id = ?')
      .bind(familyId, 'admin', userId)
      .run();

    const family = await this.db
      .prepare('SELECT * FROM families WHERE id = ?')
      .bind(familyId)
      .first<Family>();

    if (!family) {
      throw new Error('Failed to create family');
    }

    return family;
  }

  async getById(familyId: string): Promise<Family | null> {
    return this.db
      .prepare('SELECT * FROM families WHERE id = ?')
      .bind(familyId)
      .first<Family>();
  }

  async update(familyId: string, data: UpdateFamilyRequest): Promise<Family> {
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.currency !== undefined) {
      updates.push('currency = ?');
      values.push(data.currency);
    }

    if (updates.length === 0) {
      const family = await this.getById(familyId);
      if (!family) throw new Error('Family not found');
      return family;
    }

    updates.push('updated_at = ?');
    values.push(getCurrentTimestamp());
    values.push(familyId);

    await this.db
      .prepare(`UPDATE families SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const family = await this.getById(familyId);
    if (!family) throw new Error('Family not found');
    return family;
  }

  async getMembers(familyId: string): Promise<FamilyMember[]> {
    const result = await this.db
      .prepare(
        `SELECT id, email, display_name, avatar_url, role, created_at
         FROM users WHERE family_id = ?
         ORDER BY role DESC, created_at ASC`
      )
      .bind(familyId)
      .all<FamilyMember>();

    return result.results;
  }

  async joinByInviteCode(userId: string, inviteCode: string): Promise<Family> {
    const family = await this.db
      .prepare('SELECT * FROM families WHERE invite_code = ?')
      .bind(inviteCode.toUpperCase())
      .first<Family>();

    if (!family) {
      throw new Error('Invalid invite code');
    }

    // Check if user is already in a family
    const user = await this.db
      .prepare('SELECT family_id FROM users WHERE id = ?')
      .bind(userId)
      .first<{ family_id: string | null }>();

    if (user?.family_id) {
      throw new Error('You are already a member of a family');
    }

    await this.db
      .prepare('UPDATE users SET family_id = ?, role = ? WHERE id = ?')
      .bind(family.id, 'member', userId)
      .run();

    return family;
  }

  async regenerateInviteCode(familyId: string): Promise<string> {
    const newCode = generateInviteCode();

    await this.db
      .prepare('UPDATE families SET invite_code = ?, updated_at = ? WHERE id = ?')
      .bind(newCode, getCurrentTimestamp(), familyId)
      .run();

    return newCode;
  }

  async leaveFamily(userId: string): Promise<void> {
    const user = await this.db
      .prepare('SELECT family_id, role FROM users WHERE id = ?')
      .bind(userId)
      .first<{ family_id: string | null; role: string }>();

    if (!user?.family_id) {
      throw new Error('You are not a member of any family');
    }

    if (user.role === 'admin') {
      // Check if there are other members
      const memberCount = await this.db
        .prepare('SELECT COUNT(*) as count FROM users WHERE family_id = ?')
        .bind(user.family_id)
        .first<{ count: number }>();

      if (memberCount && memberCount.count > 1) {
        throw new Error('Admin cannot leave family with other members. Transfer ownership first.');
      }

      // Delete the family if admin is the only member
      await this.db
        .prepare('DELETE FROM families WHERE id = ?')
        .bind(user.family_id)
        .run();
    }

    await this.db
      .prepare('UPDATE users SET family_id = NULL, role = ? WHERE id = ?')
      .bind('member', userId)
      .run();
  }
}
