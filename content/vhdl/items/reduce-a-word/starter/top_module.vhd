library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    status : in std_logic_vector(7 downto 0);
    any_set : out std_logic;
    all_set : out std_logic;
    odd_parity : out std_logic;
    logical_present : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Summarize any and all bits: implement this requirement.
    -- Task 2. Compute parity and logical presence: implement this requirement.
    any_set <= '0';
    all_set <= '0';
    odd_parity <= '0';
    logical_present <= '0';
end architecture;
