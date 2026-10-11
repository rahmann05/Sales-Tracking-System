import React from 'react';

export function NooDocumentFact({label,children}) {
 return <div className="noo-document-fact"><dt>{label}</dt><dd>{children}</dd></div>;
}
