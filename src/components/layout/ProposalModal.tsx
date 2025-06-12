import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent,
  IconButton,
  Grid,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ProposalFormData, ClientFormData } from '../../types';
import { useClient } from '../../context/ClientContext';
import ClientModal from './ClientModal';

interface ProposalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProposalFormData) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ open, onClose, onSubmit }) => {
  const { clients, loading, error, addClient } = useClient();
  const [formData, setFormData] = useState<ProposalFormData>({
    clientId: '',
    proposalName: ''
  });
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
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
      clientId: '',
      proposalName: ''
    });
  };

  const handleOpenClientModal = () => {
    setClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setClientModalOpen(false);
  };

  const handleCreateClient = async (data: ClientFormData) => {
    const newClient = await addClient(data);
    setClientModalOpen(false);
    
    if (newClient) {
      setFormData(prev => ({
        ...prev,
        clientId: newClient.id
      }));
    }
  };

  const selectedClient = clients.find(client => client.id === formData.clientId);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Proposal</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs>
                <FormControl fullWidth margin="dense" required>
                  <InputLabel id="client-select-label">Client</InputLabel>
                  <Select
                    labelId="client-select-label"
                    id="client-select"
                    name="clientId"
                    value={formData.clientId}
                    label="Client"
                    onChange={handleSelectChange}
                    disabled={loading}
                  >
                    {loading ? (
                      <MenuItem disabled>Loading clients...</MenuItem>
                    ) : clients.length === 0 ? (
                      <MenuItem disabled>No clients available</MenuItem>
                    ) : (
                      clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <IconButton 
                  color="primary" 
                  onClick={handleOpenClientModal}
                  sx={{ mt: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Grid>
            </Grid>
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            
            {selectedClient && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {selectedClient.description}
              </Typography>
            )}
            
            <TextField
              margin="dense"
              name="proposalName"
              label="Proposal Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.proposalName}
              onChange={handleTextChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading || !formData.clientId || !formData.proposalName}
            >
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      
      <ClientModal
        open={clientModalOpen}
        onClose={handleCloseClientModal}
        onSubmit={handleCreateClient}
      />
    </>
  );
};

export default ProposalModal;