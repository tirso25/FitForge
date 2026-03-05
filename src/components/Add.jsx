import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Notyf } from 'notyf';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import 'notyf/notyf.min.css';
import '../styles/add.css';
import '../styles/general.css';

const nameRegex = /^[a-zA-Z]{3,50}$/;
const descRegex = /^.{0,255}$/;

export default function Add() {
    const [activeTab, setActiveTab] = useState('exercise'); // 'exercise' | 'category'
    const [categories, setCategories] = useState([]);

    // Exercise Form State
    const [exerciseName, setExerciseName] = useState('');
    const [exerciseDesc, setExerciseDesc] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loadingExercise, setLoadingExercise] = useState(false);
    const [exerciseFormValid, setExerciseFormValid] = useState(false);

    // Category Form State
    const [categoryName, setCategoryName] = useState('');
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [categoryFormValid, setCategoryFormValid] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const notyf = new Notyf({
        duration: 4000,
        position: { x: 'right', y: 'top' },
        dismissible: true
    });

    // Fetch categories on mount and when a new category is created
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const res = await apiFetch('/api/categories/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Validate Exercise Form
    useEffect(() => {
        const isNameValid = exerciseName.trim().length > 0 && nameRegex.test(exerciseName.trim());
        const isCategoryValid = selectedCategory !== '';
        setExerciseFormValid(isNameValid && isCategoryValid);
    }, [exerciseName, selectedCategory]);

    // Validate Category Form
    useEffect(() => {
        const isNameValid = categoryName.trim().length > 0 && nameRegex.test(categoryName.trim());
        setCategoryFormValid(isNameValid);
    }, [categoryName]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            notyf.error('Category name is required.');
            return;
        }

        if (!nameRegex.test(categoryName.trim())) {
            notyf.error('Invalid category name format.');
            return;
        }

        setLoadingCategory(true);
        try {
            const res = await apiFetch('/api/categories/createCategory', {
                method: 'POST',
                body: JSON.stringify({ name: categoryName })
            });
            const data = await res.json();

            if (res.ok) {
                notyf.success(data.message || 'Category created!');
                setCategoryName('');
                fetchCategories(); // Refresh categories list for the exercise form
            } else {
                notyf.error(data.error || 'Failed to create category.');
            }
        } catch (error) {
            notyf.error('Server error. Please try again.');
        } finally {
            setLoadingCategory(false);
        }
    };

    const handleCreateExercise = async (e) => {
        e.preventDefault();
        if (!exerciseName.trim() || !selectedCategory) {
            notyf.error('Exercise Name and Category are required.');
            return;
        }

        if (!nameRegex.test(exerciseName.trim())) {
            notyf.error('Invalid exercise name format.');
            return;
        }

        setLoadingExercise(true);
        try {
            const res = await apiFetch('/api/exercises/createExercise', {
                method: 'POST',
                body: JSON.stringify({
                    name: exerciseName,
                    description: exerciseDesc,
                    category_id: selectedCategory
                })
            });
            const data = await res.json();

            if (res.ok) {
                notyf.success(data.message || 'Exercise created!');
                setExerciseName('');
                setExerciseDesc('');
                setSelectedCategory('');
            } else {
                notyf.error(data.error || 'Failed to create exercise.');
            }
        } catch (error) {
            notyf.error('Server error. Please try again.');
        } finally {
            setLoadingExercise(false);
        }
    };

    return (
        <div className="add-page body-bg">
            <div className="blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {loadingCategories ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
                    <DotLottieReact src="/animations/loading.lottie" loop autoplay style={{ width: 150, height: 150 }} />
                </div>
            ) : (
                <div className="add-card glass-panel">
                    <div className="add-header">
                        <h2>FitForge Creation Hub</h2>
                        <p>Build your ultimate workout library</p>
                    </div>

                    <div className="tab-switcher">
                        <button
                            className={`tab-btn ${activeTab === 'exercise' ? 'active' : ''}`}
                            onClick={() => setActiveTab('exercise')}
                            type="button"
                        >
                            <span className="material-symbols-outlined">fitness_center</span>
                            Exercise
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'category' ? 'active' : ''}`}
                            onClick={() => setActiveTab('category')}
                            type="button"
                        >
                            <span className="material-symbols-outlined">category</span>
                            Category
                        </button>
                        <div className="tab-indicator" style={{ transform: activeTab === 'category' ? 'translateX(100%)' : 'translateX(0)' }}></div>
                    </div>

                    <div className="swipe-container">
                        <div className="swipe-wrapper" style={{ transform: activeTab === 'category' ? 'translateX(-50%)' : 'translateX(0)' }}>

                            {/* Panel 1: Exercise */}
                            <div className="swipe-panel">
                                <fieldset id="checkCode">
                                    <form onSubmit={handleCreateExercise} className="add-form">
                                        <div className="floating-input">
                                            <span className="material-symbols-outlined input-icon">fitness_center</span>
                                            <input
                                                id="exerciseName"
                                                type="text"
                                                placeholder="E.g., Bench Press, Squat…"
                                                value={exerciseName}
                                                onChange={(e) => setExerciseName(e.target.value)}
                                                onDoubleClick={() => setExerciseName('')}
                                                required
                                                maxLength={50}
                                            />
                                            <label htmlFor="exerciseName" className="floating-label">Exercise Name</label>
                                        </div>

                                        <div className="custom-select-wrapper">
                                            <span className="material-symbols-outlined select-icon">label</span>
                                            <select
                                                id="exerciseCategory"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                required
                                            >
                                                <option value="" disabled>Select a Category...</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <span className="select-label">Category</span>
                                        </div>
                                        {categories.length === 0 && (
                                            <p className="rules-text warning-text">
                                                <span className="material-symbols-outlined">warning</span>
                                                No categories found. Create one first!
                                            </p>
                                        )}

                                        <div className="floating-input floating-textarea">
                                            <span className="material-symbols-outlined input-icon">description</span>
                                            <textarea
                                                id="exerciseDesc"
                                                placeholder="Describe the technique, muscles worked, or key tips..."
                                                value={exerciseDesc}
                                                onChange={(e) => setExerciseDesc(e.target.value)}
                                                onDoubleClick={() => setExerciseDesc('')}
                                                maxLength={255}
                                                rows="3"
                                                className="add-textarea"
                                            ></textarea>
                                            <label htmlFor="exerciseDesc" className="floating-label">Description (Optional)</label>
                                        </div>

                                        <button
                                            type="submit"
                                            className={`add-submit-btn ${exerciseFormValid && categories.length > 0 ? 'enabled bounce-animation' : ''}`}
                                            disabled={loadingExercise || categories.length === 0 || !exerciseFormValid}
                                        >
                                            {loadingExercise ? (
                                                <span className="spinner"></span>
                                            ) : (
                                                "Create Exercise"
                                            )}
                                        </button>
                                    </form>
                                </fieldset>
                            </div>

                            {/* Panel 2: Category */}
                            <div className="swipe-panel">
                                <fieldset id="checkCode">
                                    <form onSubmit={handleCreateCategory} className="add-form">
                                        <div className="floating-input">
                                            <span className="material-symbols-outlined input-icon">fitness_center</span>
                                            <input
                                                id="categoryName"
                                                type="text"
                                                placeholder="E.g., Chest, Legs, Cardio…"
                                                value={categoryName}
                                                onChange={(e) => setCategoryName(e.target.value)}
                                                onDoubleClick={() => setCategoryName('')}
                                                required
                                                maxLength={50}
                                            />
                                            <label htmlFor="categoryName" className="floating-label">Category Name</label>
                                        </div>

                                        <button
                                            type="submit"
                                            className={`add-submit-btn ${categoryFormValid ? 'enabled bounce-animation' : ''}`}
                                            disabled={loadingCategory || !categoryFormValid}
                                        >
                                            {loadingCategory ? (
                                                <span className="spinner"></span>
                                            ) : (
                                                "Create Category"
                                            )}
                                        </button>
                                    </form>
                                </fieldset>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
