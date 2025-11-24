import { storage } from './firebase';
import * as firebaseStorage from 'firebase/storage';

/**
 * Uploads a file to Firebase Cloud Storage.
 * @param file The file to upload.
 * @param fileNumber The case file number to organize the storage path.
 * @returns A promise that resolves to the public download URL for the file.
 */
export const uploadFileToCloud = async (file: File, fileNumber: string): Promise<string> => {
  if (!file || !fileNumber) {
    throw new Error('File and fileNumber are required for upload.');
  }

  // Create a storage reference. Files will be stored in a folder structure like:
  // attachments/GEMAT-0001/DNI_JUAN_PEREZ.pdf
  const storageRef = firebaseStorage.ref(storage, `attachments/${fileNumber}/${file.name}`);

  // 'file' comes from the Blob/File API
  const snapshot = await firebaseStorage.uploadBytes(storageRef, file);
  
  // Get the download URL which can be used to view the file
  const downloadURL = await firebaseStorage.getDownloadURL(snapshot.ref);

  console.log(`☁️ [Firebase] Uploaded ${file.name} to ${snapshot.ref.fullPath}`);

  return downloadURL;
};

/**
 * Gets the download URL for a template file from Firebase Cloud Storage.
 * @param templateName The name of the template file (e.g., 'mandato_template.docx').
 * @returns A promise that resolves to the public download URL for the template.
 */
// FIX: Added the missing `getTemplateUrl` function required by the document service.
export const getTemplateUrl = async (templateName: string): Promise<string> => {
  if (!templateName) {
    throw new Error('templateName is required to get URL.');
  }

  // Assume templates are stored in a 'templates' folder in the storage root.
  const storageRef = firebaseStorage.ref(storage, `templates/${templateName}`);

  // Get the download URL
  const downloadURL = await firebaseStorage.getDownloadURL(storageRef);

  console.log(`☁️ [Firebase] Fetched URL for template ${templateName}`);

  return downloadURL;
};