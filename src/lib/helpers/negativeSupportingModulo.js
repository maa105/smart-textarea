const negativeSupportingModulo = (num, mod) => {
  if (num < 0) {
    return mod - 1 - ((-num - 1) % mod);
  }
  return num % mod;
};

export default negativeSupportingModulo;
