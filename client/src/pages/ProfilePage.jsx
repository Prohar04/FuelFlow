import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/shared/DashboardLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { User, Lock, Calendar, History, Save, Shield } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/users/me");
      if (response.data.success) {
        setUserData(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        toast.success("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error?.message || "Failed to change password"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "#F44336",
      manager: "#2196F3",
      cashier: "#4CAF50",
      employee: "#FF9800",
    };
    return colors[role] || "#9C27B0";
  };

  if (loading) {
    return (
      <DashboardLayout role={user?.role}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <div className='spinner'></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout role={user?.role}>
        <p>Failed to load profile</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role}>
      <div
        style={{
          display: "grid",
          gap: "var(--spacing-lg)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Profile Header */}
        <Card>
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-lg)",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${getRoleBadgeColor(
                  userData.role
                )}, ${getRoleBadgeColor(userData.role)}dd)`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                fontWeight: "bold",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {getInitials(userData.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, marginBottom: "var(--spacing-xs)" }}>
                {userData.name}
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "var(--color-text-secondary)",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                {userData.email}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "var(--spacing-sm)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "4px 12px",
                    background: getRoleBadgeColor(userData.role),
                    color: "white",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {userData.role}
                </span>
                {userData.jobTitle && (
                  <span
                    style={{
                      padding: "4px 12px",
                      background: "var(--color-bg-secondary)",
                      color: "var(--color-text-primary)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    {userData.jobTitle}
                  </span>
                )}
                <span
                  style={{
                    padding: "4px 12px",
                    background:
                      userData.status === "active" ? "#4CAF50" : "#F44336",
                    color: "white",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {userData.status}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "var(--spacing-lg)",
          }}
        >
          {/* Account Information */}
          <Card title='Account Information' icon={<User />}>
            <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Full Name
                </label>
                <p style={{ margin: "4px 0 0 0", fontSize: "1rem" }}>
                  {userData.name}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Email Address
                </label>
                <p style={{ margin: "4px 0 0 0", fontSize: "1rem" }}>
                  {userData.email}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Role
                </label>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "1rem",
                    textTransform: "capitalize",
                  }}
                >
                  {userData.role}
                </p>
              </div>
              {userData.pumpId && (
                <div>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Assigned Pump
                  </label>
                  <p style={{ margin: "4px 0 0 0", fontSize: "1rem" }}>
                    {userData.pumpId.name} ({userData.pumpId.code})
                  </p>
                </div>
              )}
              {userData.hourlyRate !== undefined && (
                <div>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Hourly Rate
                  </label>
                  <p style={{ margin: "4px 0 0 0", fontSize: "1rem" }}>
                    ৳{userData.hourlyRate?.toLocaleString() || "0"}/hour
                  </p>
                </div>
              )}
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Member Since
                </label>
                <p style={{ margin: "4px 0 0 0", fontSize: "1rem" }}>
                  {new Date(userData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Change Password */}
          <Card title='Change Password' icon={<Lock />}>
            <form
              onSubmit={handlePasswordChange}
              style={{ display: "grid", gap: "var(--spacing-md)" }}
            >
              <Input
                label='Current Password'
                type='password'
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                leftIcon={<Lock size={18} />}
                required
              />
              <Input
                label='New Password'
                type='password'
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                leftIcon={<Shield size={18} />}
                helperText='Minimum 6 characters'
                required
              />
              <Input
                label='Confirm New Password'
                type='password'
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                leftIcon={<Shield size={18} />}
                required
              />
              <Button
                type='submit'
                leftIcon={<Save size={18} />}
                loading={submitting}
                fullWidth
              >
                Change Password
              </Button>
            </form>
          </Card>
        </div>

        {/* Employment History */}
        {userData.employmentHistory &&
          userData.employmentHistory.length > 0 && (
            <Card
              title='Employment History'
              icon={<History />}
              subtitle='Your work history at FuelFlow'
            >
              <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
                {userData.employmentHistory.map((record, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "var(--spacing-md)",
                      background: "var(--color-bg-secondary)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: "4px solid var(--color-primary)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-sm)",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      <Calendar
                        size={16}
                        style={{ color: "var(--color-text-secondary)" }}
                      />
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {new Date(record.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div
                      style={{ marginLeft: "calc(16px + var(--spacing-sm))" }}
                    >
                      <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>
                        {record.role}{" "}
                        {record.jobTitle && `• ${record.jobTitle}`}
                      </p>
                      {record.reason && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.875rem",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {record.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
      </div>
    </DashboardLayout>
  );
}
