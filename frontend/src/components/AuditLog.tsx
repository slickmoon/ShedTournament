import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface AuditLogEntry {
  id: number;
  log: string;
  timestamp: string;
}

interface AuditLogProps {
  auditLog: AuditLogEntry[];
}

const AuditLog: React.FC<AuditLogProps> = ({ auditLog }) => {
  return (
    <>
      <h2>Audit Log</h2>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>View Audit Log</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box id="auditlog">
            {auditLog.map((log) => (
              <Typography key={log.id}>
                {new Date(log.timestamp).toLocaleString('en-AU', { 
                  timeZone: 'Australia/Sydney', 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit', 
                  hour12: false 
                }).replace(/\//g, '/').replace(',', ' -')} - {log.log}
              </Typography>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default AuditLog; 