import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

const rootFolderName = process.env.BUILD_DIRECTORY || "dist";

// Configuration

const config = {
  s3BucketName: process.env.BUCKET_NAME,
  folderPath: `./${rootFolderNamwe}`, // path relative script's location
};

// Initialize S3 Client

const s3Config = {
  signatureVersion: "v4",
  accesKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

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

  for (const fileName of files) {
    //  Get the full path of the file
    const filePath = path.join(distFolderPath, fileName);

    // If it was a directory recursively call this function again
    if (fs.lstatSync(filePath).isDirectory()) {
      uploadDirectoryFiles(filePath);
      continue;
    }

    uploadFile(filePath, fileName);
  }
}

function uploadFile(filePath, fileName) {
  const relativeFilePath = `${__dirname}/${rootFolderName}/`;
  const fileKey = filePath.replace(relativeFilePath, "");

  console.log({ fileName, filePath, fileKey });

  const fileContent = fs.readFileSync(filePath);

  //   Upload file to S3

  s3Config
    .putObject({
      Bucket: config.s3BucketName,
      Key: fileKey,
      Body: fileContent,
    })
    .promise()
    .then(() => {
      console.log(
        `Successfully uploaded '${filePath}' to ${config.s3BucketName}`
      );
    })
    .catch((e) => {
      console.error(
        `Failed to upload '${filePath}' to ${config.s3BucketName}`,
        e
      );
    });
}
