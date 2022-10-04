import { faDiagramProject } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import Company from '../Company';
import { CompanyProps } from '../Company/Company';

export type ProjectProps = Omit<CompanyProps, 'icon'>;

const Project = (props: ProjectProps) => <Company {...props} icon={faDiagramProject} />;

export default Project;
