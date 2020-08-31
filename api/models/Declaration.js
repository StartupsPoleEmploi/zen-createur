const {
  BelongsToOneRelation,
  HasManyRelation,
  HasOneRelation,
  ValidationError,
} = require('objection');

const BaseModel = require('./BaseModel');
const Employer = require('./Employer');
const DeclarationInfo = require('./DeclarationInfo');
const DeclarationReview = require('./DeclarationReview');
const DeclarationRevenue = require('./DeclarationRevenue');

class Declaration extends BaseModel {
  static get tableName() {
    return 'declarations';
  }

  $beforeValidate(jsonSchema, json, opt) {
    if (!opt.old && opt.patch) return; // Custom validation logic only makes sense for objects modified using instance.$query()

    const objectToValidate = { ...opt.old, ...json };
    const { isLookingForJob, jobSearchStopMotive } = objectToValidate;

    const throwValidationError = (label) => {
      throw new ValidationError({
        message: label,
        type: 'DeclarationValidationError',
      });
    };

    if (!isLookingForJob) {
      if (!jobSearchStopMotive) {
        throwValidationError('isLookingForJob - stopJobSearchMotive');
      }
    }
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'userId',
        'hasWorked',
        'hasEmployers',
        'hasTrained',
        'hasInternship',
        'hasSickLeave',
        'hasMaternityLeave',
        'hasRetirement',
        'hasInvalidity',
        'isLookingForJob',
        'hasFinishedDeclaringEmployers',
        'taxeDue',
      ],

      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        monthId: { type: ['integer'] },
        hasWorked: { type: 'boolean' },
        hasEmployers: { type: 'boolean' },
        hasTrained: { type: 'boolean' },
        hasInternship: { type: 'boolean' },
        hasSickLeave: { type: 'boolean' },
        hasMaternityLeave: { type: 'boolean' },
        hasRetirement: { type: 'boolean' },
        hasInvalidity: { type: 'boolean' },
        isLookingForJob: { type: 'boolean' },
        jobSearchStopMotive: { type: ['string', 'null'] },
        hasFinishedDeclaringEmployers: {
          default: false,
          type: 'boolean',
        },
        isFinished: {
          default: false,
          type: 'boolean',
        },
        isEmailSent: {
          default: false,
          type: 'boolean',
        },
        isDocEmailSent: {
          default: false,
          type: 'boolean',
        },
        isCleanedUp: {
          default: false,
          type: 'boolean',
        },
        metadata: { type: 'object' },
        transmittedAt: { type: ['string', 'object', 'null'] },
        taxeDue: { type: ['string', 'null'], enum: [null, 'monthly', 'quaterly'] },
      },
    };
  }

  // This object defines the relations to other models.
  static get relationMappings() {
    return {
      user: {
        relation: BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'declarations.userId',
          to: 'Users.id',
        },
      },
      employers: {
        relation: HasManyRelation,
        modelClass: `${__dirname}/Employer`,
        join: {
          from: 'declarations.id',
          to: 'employers.declarationId',
        },
      },
      revenues: {
        relation: HasManyRelation,
        modelClass: `${__dirname}/DeclarationRevenue`,
        join: {
          from: 'declarations.id',
          to: 'declaration_revenues.declarationId',
        },
      },
      declarationMonth: {
        relation: BelongsToOneRelation,
        modelClass: `${__dirname}/DeclarationMonth`,
        join: {
          from: 'declarations.monthId',
          to: 'declaration_months.id',
        },
      },
      infos: {
        relation: HasManyRelation,
        modelClass: `${__dirname}/DeclarationInfo`,
        join: {
          from: 'declarations.id',
          to: 'declaration_infos.declarationId',
        },
      },
      review: {
        relation: HasOneRelation,
        modelClass: `${__dirname}/DeclarationReview`,
        join: {
          from: 'declarations.id',
          to: 'declaration_reviews.declarationId',
        },
      },
    };
  }

  async $beforeDelete(queryContext) {
    await super.$beforeDelete(queryContext);
    let list = await Employer.query().where('declarationId', '=', this.id);
    list = list.concat(await DeclarationInfo.query().where('declarationId', '=', this.id));
    list = list.concat(await DeclarationReview.query().where('declarationId', '=', this.id));
    list = list.concat(await DeclarationRevenue.query().where('declarationId', '=', this.id));

    await Promise.all(
      list.map(async (d) =>
        d.$query().delete()),
    );
  }

  // helper function to determine if a declaration needs documents
  static needsDocuments(declaration) {
    return [
      'hasWorked',
      'hasInternship',
      'hasSickLeave',
      'hasMaternityLeave',
      'hasRetirement',
      'hasInvalidity',
    ].some((hasSomething) => declaration[hasSomething]);
  }
}

module.exports = Declaration;
