import bcrypt from 'bcrypt';
const hash = '$2b$10$ghJcHXiN1omAl6h1ozTpJuNGFc5O3UhCBhRskivATyOxuwKvnoFE.';
const isMatch = bcrypt.compareSync('Abcd@12345', hash);
console.log('Match with Abcd@12345:', isMatch);
