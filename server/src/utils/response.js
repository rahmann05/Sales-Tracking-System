export const successResponse = (res, statusCode = 200, data = null, message = undefined) => {
  const response = {
    success: true,
  };
  if (message !== undefined) response.message = message;
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = undefined) => {
  const response = {
    success: false,
    message,
  };
  if (errors !== undefined) response.errors = errors;
  return res.status(statusCode).json(response);
};
