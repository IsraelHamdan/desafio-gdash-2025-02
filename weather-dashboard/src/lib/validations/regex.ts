export const phoneRegex = /^\(\d{2}\)\s?9\d{4}-?\d{4}$/;

export const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export const cepRegex = /^(?:\d{5}-?\d{3})$/;

export const cpfRegex = /^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export const errorMessages = {
  cpf: "CPF inválido. Digite 11 dígitos ou use o formato 000.000.000-00.",
  telefone: "Telefone inválido. Use o formato (00) 00000-0000",
  email: "Formato de email inválido, exemplo: exemple@gmail.com",
  cep: "Cep Inválido, somente no formato xx.xxx-xx",
};
