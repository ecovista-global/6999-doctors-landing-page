import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { db, pool, schema } from '../src/db';
import { eq } from 'drizzle-orm';

describe('MT-006: Drizzle + Base Migration Typed Query Test', () => {
  const testSlug = `test-tenant-${Date.now()}`;
  let createdTenantId: string;

  after(async () => {
    if (createdTenantId) {
      await db.delete(schema.tenants).where(eq(schema.tenants.id, createdTenantId));
    }
    await pool.end();
  });

  it('inserts and queries tenant using typed Drizzle query builder', async () => {
    const [inserted] = await db
      .insert(schema.tenants)
      .values({
        slug: testSlug,
        name: 'Dr. Sharma Family Clinic',
        status: 'active',
      })
      .returning();

    assert.ok(inserted);
    assert.ok(inserted.id);
    assert.strictEqual(inserted.slug, testSlug);
    assert.strictEqual(inserted.name, 'Dr. Sharma Family Clinic');
    createdTenantId = inserted.id;

    // Insert user with uppercase in email to verify citext extension
    const [user] = await db
      .insert(schema.users)
      .values({
        tenantId: createdTenantId,
        email: 'Dr.Sharma@NoidaClinic.in',
        role: 'tenant_owner',
      })
      .returning();

    assert.ok(user);
    assert.strictEqual(user.tenantId, createdTenantId);
    assert.strictEqual(user.role, 'tenant_owner');

    // Query back with lowercase email to test citext case-insensitivity
    const [queriedUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'dr.sharma@noidaclinic.in'));

    assert.ok(queriedUser, 'User must be found using lowercase email via citext');
    assert.strictEqual(queriedUser.id, user.id);
  });
});
