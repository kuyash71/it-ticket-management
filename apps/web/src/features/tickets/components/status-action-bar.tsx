import type { AllowedAction } from "@itsm/contracts";

import { ACTION_LABELS } from "../../../shared/constants/allowed-actions";

interface StatusActionBarProps {
  actions: AllowedAction[];
}

export const StatusActionBar = ({ actions }: StatusActionBarProps): JSX.Element => {
  return (
    <div className="action-bar">
      {actions.map((action) => (
        <button key={action} className="action-chip" type="button">
          {ACTION_LABELS[action]}
        </button>
      ))}
    </div>
  );
};
