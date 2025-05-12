import React from "react";

interface EmptyFoldersProps {
  onCreateFolder?: () => void;
  documentsExist?: boolean;
}

const EmptyFolders: React.FC<EmptyFoldersProps> = ({
}) => {
  return (
    <div>
    </div>
  );
};

export default EmptyFolders;
