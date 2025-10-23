export const Account = () => {
    
    return (
        <div>
            <form className="account-form" onSubmit={handleSubmit}>
                            <label>
                                Name:
                                <input name="name" value={formData.name} onChange={handleChange} />
                            </label>
                            <label>
                                Email:
                                <input name="email" value={formData.email} onChange={handleChange} />
                            </label>
                            <label>
                                Phone:
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </label>
                            <label>
                                Street:
                                <input name="street" value={formData.street} onChange={handleChange} />
                            </label>
                            <label>
                                City:
                                <input name="city" value={formData.city} onChange={handleChange} />
                            </label>
                            <label>
                                State:
                                <input name="state" value={formData.state} onChange={handleChange} />
                            </label>
                            <label>
                                Zip:
                                <input name="zip" value={formData.zip} onChange={handleChange} />
                            </label>
                            <label>
                                Password:
                                <input type="password" name="password" value={formData.password} onChange={handleChange} />
                            </label>
                            <div className="button-wrapper">
                                <button className="button-30" type="submit">Saveasdages</button>
                            </div>
                        </form>
        </div>
    );
};

export default Account