// formStyle.ts
// formStyle.ts
export const formStyle = {
  formContainer: "flex flex-col gap-5 mt-5",
  // só o card branco
  formWrapper:
    "flex flex-col justify-start items-center w-[400px] md:w-[500px] min-h-[600px] p-10 rounded-lg bg-white shadow-md gap-6",

  heading: "text-4x1 font-bold text-gray-900 mb-6 font-poppins",

  inputWrapper: "w-full",
  inputBase:
    "w-full h-[54px] rounded-md border border-gray-300 bg-white px-4 py-4 text-gray-700 placeholder:text-gray-400 " +
    "focus:outline-none focus:ring-2 focus:border-transparent",

  labelBase: 'font-semibold',

  errorBorder: "border-red-500 focus:ring-red-500",
  errorMessage: "text-red-500 text-sm mt-1",

  forgotPassword: "text-sm font-semibold text-red-600 self-start",

  submitButton:
    "w-full rounded-md bg-[#1e2939] text-white text-lg font-bold py-4 hover:opacity-90 disabled:opacity-60 mt-10",
};

export const tableStyle = {
  container: "w-[1304px] relative",
  headerRow: "h-12 border-b border-zinc-200",
  headerCell: "text-sm font-semibold text-[#6a7282]",
  headerCellLeft: "text-left",
  headerCellCenter: "text-center",
  headerCellRight: "text-right",

  body: "w-[1287px] h-[371px] relative",
  bodyRow: "h-[53px] border-b border-zinc-200 flex items-center",
  bodyCell: "text-[13.89px] font-medium text-[#09090b]",
  bodyCellLeft: "text-left",
  bodyCellCenter: "text-center",
  bodyCellRight: "text-right",

  paymentMethod: "text-sm text-left text-[#09090b]",
  paymentValue: "text-sm text-right text-[#09090b]",
};

export const cardStyle = {
  container: "flex flex-col mt-4",
  content: "flex flex-col gap-5 mt-5",
};