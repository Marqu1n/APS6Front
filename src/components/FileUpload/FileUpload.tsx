import React, { FC } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {}

const FileUpload: FC<FileUploadProps> = () => (
  <div className={styles.FileUpload}>
    FileUpload Component
  </div>
);

export default FileUpload;
