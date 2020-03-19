/* eslint-disable */
exports.up = function(knex) {
  return knex.schema
    .hasTable('declaration_revenue_documents')
    .then(exists => {
      if (exists) return Promise.reject({ done: true });
      return knex.schema.createTable('declaration_revenue_documents', table => {
        table.increments('id').primary();
        table.string('type').notNullable();
        table.integer('declarationRevenueId').notNullable();
        table.string('file');
        table.string('originalFileName');
        table.boolean('isTransmitted').notNullable();
        table.boolean('isCleanedUp').notNullable();

        table
          .foreign('declarationRevenueId')
          .references('declaration_revenues.id');
        table.index('declarationRevenueId');
      });
    })
    .catch(err => {
      if (err.done) return Promise.resolve();
      return Promise.reject(err);
    });
};

exports.down = function(knex, Promise) {};
