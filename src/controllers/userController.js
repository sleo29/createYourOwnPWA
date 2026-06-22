const signup = async (req, res) => {
  res.status(200).json({
    status: 'Successful',
    data: 'Works!!!',
  });
};

export default { signup };
