import React from "react";
import { Trans, useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import useTheme from "@mui/system/useTheme";

import * as bn6 from "../../saveedit/bn6";
import { fallbackLng } from "../i18n";

const MEGA_BG = {
  dark: "#52849c",
  light: "#adefef",
};

const GIGA_BG = {
  dark: "#8c3152",
  light: "#f7cee7",
};

function FolderChipRow({
  chip,
}: {
  chip: {
    id: number;
    code: string;
    isRegular: boolean;
    isTag1: boolean;
    isTag2: boolean;
    count: number;
  };
}) {
  const { id, code, isRegular, isTag1, isTag2, count } = chip;
  const theme = useTheme();

  const { i18n } = useTranslation();

  const backgroundColor =
    bn6.CHIPS[id]!.class == "giga"
      ? GIGA_BG[theme.palette.mode]
      : bn6.CHIPS[id]!.class == "mega"
      ? MEGA_BG[theme.palette.mode]
      : null;

  const chipInfo = bn6.CHIPS[id];
  if (chipInfo == null || chipInfo.description == null) {
    return null;
  }

  return (
    <TableRow sx={{ backgroundColor }}>
      <TableCell sx={{ width: "28px", textAlign: "right" }}>
        <strong>{count}x</strong>
      </TableCell>
      <TableCell sx={{ width: 0 }}>
        <img
          height="28"
          width="28"
          src={(() => {
            try {
              return require(`../../../static/images/games/bn6/chipicons/${id}.png`);
            } catch (e) {
              return "";
            }
          })()}
          style={{ imageRendering: "pixelated" }}
        />
      </TableCell>
      <TableCell component="th">
        <Tooltip
          title={
            chipInfo.description[
              i18n.resolvedLanguage as keyof typeof chipInfo.description
            ] ||
            chipInfo.description[
              fallbackLng as keyof typeof chipInfo.description
            ]
          }
          placement="right"
        >
          <span>
            {chipInfo.name[
              i18n.resolvedLanguage as keyof typeof chipInfo.name
            ] || chipInfo.name[fallbackLng as keyof typeof chipInfo.name]}{" "}
            {code}
          </span>
        </Tooltip>{" "}
        {isRegular ? (
          <Chip
            label={<Trans i18nKey="play:folder.regular-chip" />}
            sx={{ backgroundColor: "#FF42A5", color: "white" }}
            size="small"
          />
        ) : null}{" "}
        {isTag1 ? (
          <Chip
            label={<Trans i18nKey="play:folder.tag-chip" />}
            sx={{ backgroundColor: "#29F721", color: "white" }}
            size="small"
          />
        ) : null}{" "}
        {isTag2 ? (
          <Chip
            label={<Trans i18nKey="play:folder.tag-chip" />}
            sx={{ backgroundColor: "#29F721", color: "white" }}
            size="small"
          />
        ) : null}
      </TableCell>
      <TableCell sx={{ width: 0 }}>
        <img
          height="28"
          width="28"
          src={require(`../../../static/images/games/bn6/elements/${bn6.CHIPS[
            id
          ]!.element!}.png`)}
          style={{ imageRendering: "pixelated" }}
        />
      </TableCell>
      <TableCell sx={{ width: "56px", textAlign: "right" }}>
        <strong>{chipInfo.damage}</strong>
      </TableCell>
      <TableCell sx={{ width: "64px", textAlign: "right" }}>
        {chipInfo.mb!}MB
      </TableCell>
    </TableRow>
  );
}

export default function FolderViewer({
  editor,
  active,
}: {
  editor: bn6.Editor;
  active: boolean;
}) {
  const chips: {
    id: number;
    code: string;
    isRegular: boolean;
    isTag1: boolean;
    isTag2: boolean;
    count: number;
  }[] = [];
  const chipCounter: { [key: string]: number } = {};
  for (let i = 0; i < 30; i++) {
    const chip = editor.getChip(editor.getEquippedFolder(), i);
    if (chip == null) {
      continue;
    }
    const chipKey = `${chip.id}:${chip.code}`;
    if (!Object.prototype.hasOwnProperty.call(chipCounter, chipKey)) {
      chipCounter[chipKey] = 0;
      chips.push({
        ...chip,
        isRegular: false,
        isTag1: false,
        isTag2: false,
        count: 0,
      });
    }
    chipCounter[chipKey]++;
  }

  for (const chip of chips) {
    chip.count = chipCounter[`${chip.id}:${chip.code}`];

    const regularChipIdx = editor.getRegularChipIndex(
      editor.getEquippedFolder()
    );
    if (regularChipIdx != null) {
      const regularChip = editor.getChip(
        editor.getEquippedFolder(),
        regularChipIdx
      )!;
      if (chip.id == regularChip.id && chip.code == regularChip.code) {
        chip.isRegular = true;
      }
    }

    const tagChip1Idx = editor.getTagChip1Index(editor.getEquippedFolder());
    if (tagChip1Idx != null) {
      const tagChip1 = editor.getChip(editor.getEquippedFolder(), tagChip1Idx)!;
      if (chip.id == tagChip1.id && chip.code == tagChip1.code) {
        chip.isTag1 = true;
      }
    }

    const tagChip2Idx = editor.getTagChip2Index(editor.getEquippedFolder());
    if (tagChip2Idx != null) {
      const tagChip2 = editor.getChip(editor.getEquippedFolder(), tagChip2Idx)!;
      if (chip.id == tagChip2.id && chip.code == tagChip2.code) {
        chip.isTag2 = true;
      }
    }
  }

  return (
    <Box
      flexGrow={1}
      display={active ? "block" : "none"}
      overflow="auto"
      sx={{ px: 1, height: 0 }}
    >
      <Table size="small">
        <TableBody>
          {chips.map((chip, i) => (
            <FolderChipRow key={i} chip={chip} />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
