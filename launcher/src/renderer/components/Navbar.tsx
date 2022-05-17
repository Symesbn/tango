import React from "react";
import { useTranslation } from "react-i18next";

import SettingsIcon from "@mui/icons-material/Settings";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import SlowMotionVideoOutlinedIcon from "@mui/icons-material/SlowMotionVideoOutlined";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import Badge from "@mui/material/Badge";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";

import { useUpdateStatus } from "./UpdaterStatusContext";

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  overflowX: "hidden",
  width: `calc(${theme.spacing(6)} + 1px)`,
}));

const NavbarButtonWrapper = styled(ListItemButton)(({ theme }) => ({
  "&.Mui-selected": {
    transition: "none",
    borderLeft: `2px solid ${theme.palette.primary.main} !important`,
    "& > .MuiListItemIcon-root": {
      marginLeft: "-2px",
      color: `${theme.palette.primary.main} !important`,
    },
  },
}));

function NavbarButton({
  title,
  onClick,
  unselectedIcon,
  selectedIcon,
  selected,
}: {
  title: string;
  onClick: React.MouseEventHandler;
  unselectedIcon: React.ReactNode;
  selectedIcon: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <Tooltip title={title} enterDelay={0} placement="right">
      <NavbarButtonWrapper
        onClick={onClick}
        selected={selected}
        sx={{
          minHeight: 48,
          px: 1.5,
          justifyContent: "center",
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: "auto",
            justifyContent: "center",
          }}
        >
          {selected ? selectedIcon : unselectedIcon}
        </ListItemIcon>
      </NavbarButtonWrapper>
    </Tooltip>
  );
}

export type NavbarSelection = "play" | "replays" | "settings" | null;

export default function Navbar({
  selected,
  onSelect,
}: {
  selected: NavbarSelection;
  onSelect: (selected: NavbarSelection) => void;
}) {
  const { t } = useTranslation();
  const { status: updateStatus } = useUpdateStatus();

  const SettingsIconWrapper = ({ children }: { children: React.ReactNode }) =>
    updateStatus == "available" ? (
      <Badge color="secondary" variant="dot">
        {children}
      </Badge>
    ) : updateStatus == "downloaded" ? (
      <Badge color="info" variant="dot">
        {children}
      </Badge>
    ) : (
      <>{children}</>
    );

  return (
    <Drawer variant="permanent" open={true}>
      <List sx={{ py: 0 }}>
        <NavbarButton
          selected={selected == "play"}
          onClick={() => {
            onSelect("play");
          }}
          title={t("navbar:play")}
          unselectedIcon={<SportsEsportsOutlinedIcon />}
          selectedIcon={<SportsEsportsIcon />}
        />
        <NavbarButton
          selected={selected == "replays"}
          onClick={() => {
            onSelect("replays");
          }}
          title={t("navbar:replays")}
          unselectedIcon={<SlowMotionVideoOutlinedIcon />}
          selectedIcon={<SlowMotionVideoIcon />}
        />
      </List>
      <List sx={{ mt: "auto", py: 0 }}>
        <NavbarButton
          selected={selected == "settings"}
          onClick={() => {
            onSelect("settings");
          }}
          title={
            updateStatus == "available"
              ? t("navbar:settings-update-available")
              : updateStatus == "downloaded"
              ? t("navbar:settings-update-downloaded")
              : t("navbar:settings")
          }
          unselectedIcon={
            <SettingsIconWrapper>
              <SettingsOutlinedIcon />
            </SettingsIconWrapper>
          }
          selectedIcon={
            <SettingsIconWrapper>
              <SettingsIcon />
            </SettingsIconWrapper>
          }
        />
      </List>
    </Drawer>
  );
}
