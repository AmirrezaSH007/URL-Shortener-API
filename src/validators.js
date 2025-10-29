import Joi from 'joi';

export const shortenSchema = Joi.object({
  url: Joi.string().uri({ scheme: [/https?/] }).required(),
  slug: Joi.string().alphanum().min(3).max(32).optional()
});
