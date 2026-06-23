export const sendSuccessRes = (
  res,
  { statusCode = 200, status = 'success', data = null, message = null } = {}
) => {
  return res.status(statusCode).json({
    status,
    message,
    data: { data },
  });
};

// export sendErrorRes=()
