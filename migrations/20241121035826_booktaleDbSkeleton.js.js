/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username").notNullable().unique();
    table.string("password").notNullable();
    table.string("email").notNullable().unique();
    table.string("first_name").nullable();
    table.string("last_name").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("books", (table) => {
    table.increments("id").primary();
    table.string("title").notNullable();
    table.string("author").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("qr_codes", (table) => {
    table.increments("id").primary();
    table
      .integer("book_id")
      .references("id")
      .inTable("books")
      .onDelete("CASCADE");
    table.string("qr_code_url").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("comments", (table) => {
    table.increments("id").primary();
    table
      .integer("book_id")
      .references("id")
      .inTable("books")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("comment").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("user_books", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("book_id")
      .references("id")
      .inTable("books")
      .onDelete("CASCADE");
    table.timestamp("saved_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

export const down = async (knex) => {
  await knex.schema
    .dropTableIfExists("user_books")
    .dropTableIfExists("comments")
    .dropTableIfExists("qr_codes")
    .dropTableIfExists("books")
    .dropTableIfExists("users");
};
