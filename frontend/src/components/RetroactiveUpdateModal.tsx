import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface RetroactiveUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (applyRetroactively: boolean) => void;
  leaveTypeName: string;
  newDays: number;
}

export function RetroactiveUpdateModal({
  isOpen,
  onClose,
  onConfirm,
  leaveTypeName,
  newDays
}: RetroactiveUpdateModalProps): React.JSX.Element {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
          <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
            Update {leaveTypeName} Policy
          </h3>
          <div className="mt-2 text-sm text-gray-500 space-y-4">
            <p>
              You are updating the default annual days for <strong>{leaveTypeName}</strong> to <strong>{newDays} days</strong>.
            </p>
            <p>
              Would you like to apply this new limit retroactively to all existing employees? 
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Apply Retroactively:</strong> The new limit will be recalculated for existing balances. Employees may gain or lose days.
              </li>
              <li>
                <strong>Future Only:</strong> This limit will only apply to new employees hired after this change. Existing employees will keep their current limits.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
        <button
          type="button"
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
          onClick={() => onConfirm(true)}
        >
          Apply Retroactively
        </button>
        <button
          type="button"
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={() => onConfirm(false)}
        >
          Future Only
        </button>
        <button
          type="button"
          className="mt-3 w-full inline-flex justify-center text-base font-medium text-gray-500 hover:text-gray-700 sm:mt-0 sm:w-auto sm:text-sm sm:mr-auto sm:py-2"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
