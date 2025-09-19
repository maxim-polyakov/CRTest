import React from 'react';
import '../../styles.css';

export const ItemRow = React.memo(({ item, isSelected, onSelect }) => (
    <tr
        data-id={item.id} // Важно: data-id для получения ID:cite[4]
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
            <span className="drag-handle" title="Перетащите для изменения порядка">
                ☰
            </span>
        </td>
    </tr>
));