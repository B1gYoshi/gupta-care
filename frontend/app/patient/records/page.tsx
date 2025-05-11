'use client';

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

  const handleDelete = async (recordId: number) => {
    try {
      const response = await fetch(`/api/medical_records/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchRecords();
      } else {
        const result = await response.json();
        setStatusMessage(`Failed to delete: ${result.message}`);
        setStatusType("error");
      }
    } catch (err) {
      setStatusMessage(`Error deleting record.`);
      setStatusType("error");
    }
  };

  return (
    <Box sx={{ px: 2, py: 6, maxWidth: '800px', margin: 'auto' }}>
      {/* Upload Box */}
      <Paper sx={{
        backgroundColor: 'white',
        padding: 4,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        mb: 6
      }}>
        <Typography variant="h5" gutterBottom sx={{ borderBottom: '1px solid #ccc', pb: 1 }}>
          <b>Upload New Record</b>
        </Typography>

        <input type="file" onChange={handleFileChange} />
        <Box sx={{ my: 2}}>
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
      </Paper>

      {/* Records Box */}
      <Paper sx={{
        backgroundColor: 'white',
        padding: 4,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}>
        <Typography variant="h5" gutterBottom sx={{ borderBottom: '1px solid #ccc', pb: 1 }}>
          <b>My Medical Records</b>
        </Typography>

        {records.length === 0 ? (
          <Typography>No records found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Document</TableCell>
                  <TableCell>Action</TableCell>
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
                    <TableCell>
                      <Button color="error" onClick={() => handleDelete(record.record_id)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
