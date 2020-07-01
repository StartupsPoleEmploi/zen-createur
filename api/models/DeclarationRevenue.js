const { BelongsToOneRelation, HasManyRelation } = require('objection');
const BaseModel = require('./BaseModel');
const DeclarationRevenueDocument = require('./DeclarationRevenueDocument');

class DeclarationRevenue extends BaseModel {
  static get tableName() {
    return 'declaration_revenues';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'declarationId'],

      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        declarationId: { type: 'integer' },
        workHours: { type: ['integer', 'null'] },
        turnover: { type: ['number', 'null'] },
        hasEndedThisMonth: { type: ['boolean', 'null'] },
      },
    };
  }

  async $beforeDelete(queryContext) {
    await super.$beforeDelete(queryContext);
    const list = await DeclarationRevenueDocument.query().where('declarationRevenueId', '=', this.id);

    await Promise.all(
      list.map(async (d) =>
        d.$query().delete()),
    );
  }

  // This object defines the relations to other models.
  static get relationMappings() {
    return {
      user: {
        relation: BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'declaration_revenues.userId',
          to: 'Users.id',
        },
      },
      declaration: {
        relation: BelongsToOneRelation,
        modelClass: `${__dirname}/Declaration`,
        join: {
          from: 'declaration_revenues.declarationId',
          to: 'declarations.id',
        },
      },
      documents: {
        relation: HasManyRelation,
        modelClass: `${__dirname}/DeclarationRevenueDocument`,
        join: {
          from: 'declaration_revenues.id',
          to: 'declaration_revenue_documents.declarationRevenueId',
        },
      },
    };
  }
}

module.exports = DeclarationRevenue;
