export default async function handler(req, res) {
    return res.status(200).json({
        success: true,
        message: "HELLO WORLD FROM GENERATE V2",
        timestamp: new Date().toISOString(),
        version: "NUCLEAR_OPTION"
    });
}
