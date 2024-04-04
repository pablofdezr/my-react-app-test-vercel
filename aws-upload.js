import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const rootFolderName = process.env.BUILD_DIRECTORY || "dist";

// Configuration
const config = {
  s3BucketName: process.env.BUCKET_NAME,
  folderPath: `./${rootFolderName}`,
};

// Initialize S3 Client
const s3 = new AWS.S3({
  signatureVersion: "v4",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Resolve full folder path
const distFolderPath = path.join(__dirname, config.folderPath);
uploadDirectoryFiles(distFolderPath);

function uploadDirectoryFiles(distFolderPath) {
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
    await s3
      .putObject({
        Bucket: config.s3BucketName,
        Key: fileKey,
        Body: fileContent,
      })
      .promise();
    console.log(
      `Successfully uploaded '${filePath}' to ${config.s3BucketName}`
    );
  } catch (e) {
    console.error(
      `Failed to upload '${filePath}' to ${config.s3BucketName}`,
      e
    );
  }
}
