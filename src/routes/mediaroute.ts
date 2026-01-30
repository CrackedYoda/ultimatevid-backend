import { Router } from "express";
import { Request,Response } from "express";
import path from "path";
import fs from "fs";

const router = Router();

const base = path.join(process.cwd(), "videos");


router.get("/:file", (req: Request, res: Response) => {
const file: string =  req.params.file as string;
console.log(file);  
const filePath = path.join(base, file);

if (!fs.existsSync(filePath)){
    return res.status(404).send("File not found");
}


res.setHeader("Content-Type", "video/mp4");
res.setHeader("Accept-Ranges", "bytes");
res.setHeader("Content-Disposition", `attachment; filename="${file}"`);

res.sendFile(filePath)

})

export default router;
