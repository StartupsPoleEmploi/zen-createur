exports.up = async function (knex) {
  await knex.schema.table('declarations', table => {
    table.boolean('hasEmployers').defaultTo(false)
  });
};

exports.down = async function (knex) {
  knex.schema.table('declarations', function (table) {
    table.dropColumn('hasEmployers');
  });
};
