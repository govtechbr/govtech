// Liga um schema do zod ao react-hook-form. Equivale ao zodResolver do pacote
// @hookform/resolvers, sem a dependência extra (os campos daqui são planos).
export function zodResolver(schema) {
  return async (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return { values: result.data, errors: {} }
    }

    const errors = {}

    for (const issue of result.error.issues) {
      const field = issue.path.join('.')
      errors[field] ??= { type: issue.code, message: issue.message }
    }

    return { values: {}, errors }
  }
}
