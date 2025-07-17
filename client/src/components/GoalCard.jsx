import React, { useEffect, useState ,useRef} from "react";
import {
  Button,
  IconButton,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import "../components/GoalCard.css"

import {
  fetchGoals,
  addGoal,
  updateGoal,
  deleteGoal,
} from "../pages/services/services";

const FinancialGoalsCard = () => {
  const [goals, setGoals] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const hasFetched = useRef(false);
  
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    deadline: "",
    manual_allocated: "",
  });

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      loadGoals();
    }  
  }, []);

  const loadGoals = async () => {
    try {
      const data = await fetchGoals();
      setGoals(data);


    } catch (err) {

    }
  };

  const handleOpenForm = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        deadline: goal.deadline,
        manual_allocated: goal.manual_allocated || "",
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: "",
        target_amount: "",
        deadline: "",
        manual_allocated: "",
      });
    }
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setFormData({
      name: "",
      target_amount: "",
      deadline: "",
      manual_allocated: "",
    });
    setEditingGoal(null);
  };

  const handleSave = async () => {
    try {
      const formatted = {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        deadline: formData.deadline,
        manual_allocated: formData.manual_allocated
          ? parseFloat(formData.manual_allocated)
          : null,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, formatted);
      } else {
        await addGoal(formatted);
      }

      handleCloseForm();
      await loadGoals();
    } catch (err) {
      console.error("Failed to save goal:", err);
    }
  };

  const handleDelete = async (goalId) => {
    try {
      await deleteGoal(goalId);
      await loadGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  return (
    <div className="advice-card advice-goals-card">
      <div className="advice-card-title">
        Financial Goal Tracking
        <IconButton onClick={() => handleOpenForm()} sx={{ float: "right" }}>
          <AddIcon />
        </IconButton>
      </div>

      <div className="advice-goals-row">
        {goals.map((goal, idx) => {
          const percent = Math.min(
            100,
            Math.round(((goal.allocated || 0) / goal.target_amount) * 100)
          );
          return (
            <div className="advice-goal-col" key={goal.id || idx} style={{}}>
              <div className="advice-goal-title-row">
                <span className="advice-goal-title">{goal.name}</span>
                <span className="advice-goal-percent">{percent}% complete</span>
              </div>
              <LinearProgress
                className="advice-goal-bar"
                variant="determinate"
                value={percent}
                style={{ height: 8, borderRadius: 6, background: "#f0f1f3" }}
                sx={{
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "#1ecb6b",
                  },
                }}
              />
              <div
                className="advice-goal-meta"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  margin: "1%",
                }}
              >
                <div>
                  ₹{(goal.allocated || 0).toLocaleString()} of ₹
                  {goal.target_amount.toLocaleString()}
                </div>
                <div> Deadline: {goal.deadline}</div>
              </div>
              {goal.months_left != null &&
                goal.required_monthly_saving != null && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "4px",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    {goal.months_left} months left — Save ₹
                    {goal.required_monthly_saving.toLocaleString()} / month
                  </div>
                )}

              <div className="advice-goal-actions">
                <IconButton onClick={() => handleOpenForm(goal)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(goal.id)}>
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog for Adding/Editing Goals */}
      <Dialog open={open} onClose={handleCloseForm}>
        <DialogTitle>{editingGoal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Goal Name"
            fullWidth
            margin="dense"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Target Amount"
            fullWidth
            margin="dense"
            type="number"
            value={formData.target_amount}
            onChange={(e) =>
              setFormData({ ...formData, target_amount: e.target.value })
            }
          />
          <TextField
            label="Deadline"
            fullWidth
            margin="dense"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.deadline}
            onChange={(e) =>
              setFormData({ ...formData, deadline: e.target.value })
            }
          />
          <TextField
            label="Manual Allocated (optional)"
            fullWidth
            margin="dense"
            type="number"
            value={formData.manual_allocated}
            onChange={(e) =>
              setFormData({ ...formData, manual_allocated: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FinancialGoalsCard;
