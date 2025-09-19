import React from 'react';

export const ItemRow = React.memo(({ item, isSelected, onSelect }) => (
    <tr
        data-id={item.id}
        className={isSelected ? 'selected' : ''}
    >
        <td className="checkbox-cell">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(item.id)}
            />
        </td>
        <td>{item.id}</td>
        <td>{item.name}</td>
        <td>{item.description}</td>
        <td>{item.value}</td>
        <td>
            <span className="drag-handle">☰</span>
        </td>
    </tr>
));