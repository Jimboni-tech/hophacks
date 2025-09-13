import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;


const Home = () => {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');

	const fetchProjects = async (query = '') => {
		setLoading(true);
		setError('');
		try {
			const res = await axios.get(`${API_URL}/projects`, {
				params: { q: query }
			});
			setProjects(res.data.data || []);
		} catch (err) {
			setError('Failed to fetch projects');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchProjects();
	}, []);

	const handleSearch = (e) => {
		e.preventDefault();
		fetchProjects(search);
	};

	return (
		<div style={{maxWidth: 600, margin: '40px auto', padding: 20}}>	
			<h2>Available Projects</h2>
			<form onSubmit={handleSearch} style={{marginBottom: 24}}>
				<input
					type="text"
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder="Search projects..."
					style={{width: '80%', padding: 8, fontSize: 16}}
				/>
				<button type="submit" style={{marginLeft: 8, padding: '8px 16px'}}>Search</button>
			</form>
			{loading ? (
				<div>Loading projects...</div>
			) : error ? (
				<div style={{color: 'red'}}>{error}</div>
			) : projects.length === 0 ? (
				<div>No projects found.</div>
			) : (
				<ul style={{listStyle: 'none', padding: 0}}>
					{projects.map(project => (
						<li key={project._id} style={{marginBottom: 24, borderBottom: '1px solid #ccc', paddingBottom: 16}}>
														<h3 style={{margin: 0}}>
															<Link to={`/projects/${project._id}`} style={{ textDecoration: 'none', color: '#333' }}>
																{project.name}
															</Link>
														</h3>
							<p style={{margin: '8px 0'}}>{project.description}</p>
							{project.company && (
								<div style={{margin: '8px 0', fontStyle: 'italic'}}>
									<span>By: {project.company.name}</span>
									{project.company.website && (
										<>
											{' '}| <a href={project.company.website} target="_blank" rel="noopener noreferrer">{project.company.website}</a>
										</>
									)}
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default Home;
