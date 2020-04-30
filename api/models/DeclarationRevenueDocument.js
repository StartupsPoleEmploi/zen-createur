const { BelongsToOneRelation } = require('objection');
const BaseModel = require('./BaseModel');

class DeclarationRevenueDocument extends BaseModel {
  static get tableName() {
    return 'declaration_revenue_documents';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['declarationRevenueId', 'type'],

      properties: {
        id: { type: 'integer' },
        type: { type: ['string'] },
        declarationRevenueId: { type: 'integer' },
        file: { type: ['string', 'null'] },
        originalFileName: { type: ['string', 'null'] },
        isTransmitted: { type: 'boolean' },
        isCleanedUp: { type: 'boolean' },
      },
    };
  }

  // This object defines the relations to other models.
  static get relationMappings() {
    return {
      declarationRevenue: {
        relation: BelongsToOneRelation,
        modelClass: `${__dirname}/DeclarationRevenue`,
        join: {
          from: 'declaration_revenue_documents.declarationRevenueId',
          to: 'declaration_revenues.id',
        },
      },
    };
  }

  static get types() {
    return {
      monthlyIS: 'monthlyIS',
      quaterlyIS: 'quaterlyIS',
    };
  }
}

module.exports = DeclarationRevenueDocument;
