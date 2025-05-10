'use client'

import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';

import { useEffect, useState } from 'react';

type MedicalRecord = {
  record_id: number;
  record_type: string;
  description: string;
  document_link: string;
  uploaded_at: string;
};

const recordTypes = [
  "Prescription/Medication",
  "Imaging/Radiology",
  "Immunizations",
  "Insurance",
  "Other",
];

export default function Records() {
  const [file, setFile] = useState<File | null>(null);
  const [recordType, setRecordType] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<"success" | "error" | "">('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/medical_records', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatusMessage("Please select a file.");
      setStatusType("error");
      return;
    }
    if (!recordType) {
      setStatusMessage("Please select a record type.");
      setStatusType("error");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('record_type', recordType);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatusMessage(`Uploaded: ${result.filename}`);
        setStatusType("success");
        setFile(null);
        setRecordType('');
        await fetchRecords();
      } else {
        setStatusMessage(`Upload failed: ${result.message}`);
        setStatusType("error");
      }
    } catch (error: any) {
      setStatusMessage(`Upload error: ${error.message}`);
      setStatusType("error");
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: '900px', margin: 'auto' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Upload New Record
      </Typography>

      <Box component={Paper} sx={{ p: 4, maxWidth: '900px', margin: 'auto', border: 1, borderColor: 'black' }}>

        <input type="file" onChange={handleFileChange} />
        <Box sx={{ my: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="record-type-label">Record Type</InputLabel>
            <Select
              labelId="record-type-label"
              value={recordType}
              label="Record Type"
              onChange={(e) => setRecordType(e.target.value)}
            >
              {recordTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button variant="contained" color="primary" onClick={handleUpload}>
          Upload
        </Button>

        {statusMessage && statusType && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={statusType}>{statusMessage}</Alert>
          </Box>
        )}
      </Box>


      <Typography variant="h4" align="center" gutterBottom sx={{ mt: 8 }}>
        My Medical Records
      </Typography>

      {records.length === 0 ? (
        <Typography>No records found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid black' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Document</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record, index) => (
                <TableRow key={record.record_id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{record.record_type}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{new Date(record.uploaded_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <a href={record.document_link} target="_blank" rel="noopener noreferrer">
                      View File
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
