import { Router } from "express";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";

const router = Router();

const base = path.join(process.cwd(), "videos");


router.get("/:file", (req: Request, res: Response) => {
    const file: string = req.params.file as string;
    console.log(file);
    const filePath = path.join(base, file);

    if (!fs.existsSync(filePath)) {
        const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Not Found</title>
          <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #f8f9fa; }
              h1 { color: #dc3545; }
              p { font-size: 18px; color: #6c757d; }
          </style>
          <script>
              setTimeout(() => {
                  window.location.href = "/"; 
              }, 3000);
          </script>
      </head>
      <body>
          <h1>Something went wrong</h1>
          <p>File not found or expired. Redirecting you back...</p>
      </body>
      </html>
    `;
        res.setHeader("Content-Type", "text/html");
        return res.status(404).send(errorHtml);
    }


    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);

    res.sendFile(filePath)

})

export default router;
