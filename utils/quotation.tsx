 export const generateFileName = ({
    format,
    companyName,
    clientName,
    companyType,
}: {
    format: string;
    companyName?: string;
    clientName?: string;
    companyType?: string;
}) => {
    const now = new Date();

    const formattedDate = `${String(now.getDate()).padStart(2, '0')}_${now.toLocaleString('en-US', { month: 'short' })}_${now.getFullYear()}`;

    let fileName = format;

    // replace variables
    fileName = fileName.replace('{company_name}', companyName || '');
    fileName = fileName.replace('{full_name}', clientName || '');
    fileName = fileName.replace('{date}', formattedDate);
    fileName = fileName.replace('{bussiness_type}', companyType || '');

    // clean string
    fileName = fileName.replace(/\{[^}]+\}/g, '');

    // ✅ VERY IMPORTANT: Remove invalid file system characters
    fileName = fileName
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // invalid in Android/Windows
        .replace(/[&^%$#@!]+/g, '')            // remove unsafe symbols (your crash cause)
        .replace(/\s+/g, '_')                  // spaces → _
        .replace(/_+/g, '_')                   // avoid ___
        .trim();

    return fileName + '.pdf';

};