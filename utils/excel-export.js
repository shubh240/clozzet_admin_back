import ExcelJS from "exceljs";

/**
 * Generate and send Excel file in response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column configs: [{ header, key, width }]
 * @param {String} filename - Name of the file to download
 */
export const generateExcelFile = async (res, data, columns, filename = "export") => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Define columns
    worksheet.columns = columns;

    // Add rows
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Excel export failed:", error);
    return res.status(500).json({ success: false, message: "Excel export failed" });
  }
};
