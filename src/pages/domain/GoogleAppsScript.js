/**
 * Processes domain appraisal data from the active Google Sheet.
 * Assumes the data is structured as described:
 * Column A: DOMAIN NAME
 * Column B: AUCTION VALUE
 * Column C: MARKETPLACE VALUE
 * Column D: BROKERAGE VALUE
 * Column E: SUM VALUE (Optional, can be calculated)
 * Column F: Best Value (Usage unclear from example, currently ignored)
 * Data starts from row 2.
 */
function processDomainData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();

    // Get data starting from the second row (index 2) to the last row,
    // covering the first 6 columns (A to F).
    const startRow = 2;
    const numColumns = 6; // A to F
    const dataRange = sheet.getRange(startRow, 1, sheet.getLastRow() - startRow + 1, numColumns);
    const values = dataRange.getValues();

    // Helper function to clean currency values (remove '$', ',', and convert to number)
    function cleanCurrencyValue(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const cleaned = value.replace(/[\$,]/g, '').trim();
            const number = parseFloat(cleaned);
            return isNaN(number) ? 0 : number; // Return 0 if conversion fails
        }
        return 0; // Return 0 for unexpected types
    }

    // Iterate over each row of data
    values.forEach((row, index) => {
        const currentDataRowIndex = startRow + index; // Actual row number in the sheet

        const domainName = row[0]; // Column A
        const auctionValue = cleanCurrencyValue(row[1]); // Column B
        const marketplaceValue = cleanCurrencyValue(row[2]); // Column C
        const brokerageValue = cleanCurrencyValue(row[3]); // Column D

        // Calculate the sum of the three values
        const calculatedSum = auctionValue + marketplaceValue + brokerageValue;

        // Log the results (optional)
        Logger.log(`Row ${currentDataRowIndex}: Domain: ${domainName}, Auction: ${auctionValue}, Marketplace: ${marketplaceValue}, Brokerage: ${brokerageValue}, Calculated Sum: ${calculatedSum}`);

        // Write the calculated sum back to the 'SUM VALUE' column (Column E)
        const sumValueCell = sheet.getRange(currentDataRowIndex, 5);
        sumValueCell.setValue(calculatedSum);
        sumValueCell.setNumberFormat("$#,##0");

        // Find the best value type
        let bestType = 'Auction';
        let bestValue = auctionValue;
        if (marketplaceValue > bestValue) {
            bestValue = marketplaceValue;
            bestType = 'Marketplace';
        }
        if (brokerageValue > bestValue) {
            bestValue = brokerageValue;
            bestType = 'Brokerage';
        }
        Logger.log(`Row ${currentDataRowIndex}: Best value type is ${bestType} with $${bestValue}`);
    });

    // Display a message when done
    SpreadsheetApp.getUi().alert('Domain data processing complete!');
}
