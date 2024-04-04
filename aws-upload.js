// import AWS from "aws-sdk";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // Import necesario para convertir URL a ruta de archivo

// Obtén el __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootFolderName = process.env.BUILD_DIRECTORY || "dist";

// Configuration
const config = {
  s3BucketName: process.env.BUCKET_NAME,
  folderPath: `./${rootFolderName}`,
};

// Initialize S3 Client
const s3 = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Resolve full folder path
const distFolderPath = path.join(__dirname, config.folderPath);
uploadDirectoryFiles(distFolderPath);

function uploadDirectoryFiles(distFolderPath) {
  // Comprobar si el directorio existe
  if (!fs.existsSync(distFolderPath)) {
    console.error(
      `El directorio '${distFolderPath}' no existe. Verifica que la construcción se haya completado exitosamente.`
    );
    return;
  }

  const files = fs.readdirSync(distFolderPath);

  if (!files || files.length === 0) {
    console.log(
      `Provided folder '${distFolderPath}' is empty or does not exist.`
    );
    return;
  }

  files.forEach((fileName) => {
    const filePath = path.join(distFolderPath, fileName);
    if (fs.lstatSync(filePath).isDirectory()) {
      uploadDirectoryFiles(filePath);
    } else {
      uploadFile(filePath, fileName);
    }
  });
}

async function uploadFile(filePath, fileName) {
  const relativeFilePath = path.join(__dirname, rootFolderName);
  const fileKey = filePath.replace(relativeFilePath + path.sep, "");

  console.log({ fileName, filePath, fileKey });

  const fileContent = fs.readFileSync(filePath);

  // Upload file to S3
  try {
    const data = await s3.send(
      new PutObjectCommand({
        Bucket: config.s3BucketName,
        Key: fileKey,
        Body: fileContent,
      })
    );
    console.log(`File uploaded successfully. ${data}`);
  } catch (err) {
    console.error(`Error uploading file: ${err.message}`);
  }

  return;
}
