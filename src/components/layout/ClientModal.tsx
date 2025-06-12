import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { ClientFormData } from '../../types';
import { useClient } from '../../context/ClientContext';

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ open, onClose, onSubmit }) => {
  const { loading } = useClient();
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      description: ''
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Client</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Client Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <TextField
            margin="dense"
            name="description"
            label="Client Description"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.name || !formData.description}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Client'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ClientModal;