library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    ready : in std_logic;
    fault : in std_logic;
    mode : in std_logic_vector(1 downto 0);
    status : out std_logic_vector(3 downto 0);
    fault_seen : out std_logic;
    mode_seen : out std_logic_vector(1 downto 0);
    service_mode : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Carry the four bits 1010: implement this requirement.
    -- Task 2. Join ready, fault, and mode into one word: implement this requirement.
    -- Task 3. Read the fault bit from the word: implement this requirement.
    -- Task 4. Read the two mode bits from the word: implement this requirement.
    -- Task 5. Check whether mode is 10: implement this requirement.
    status <= (others => '0');
    fault_seen <= '0';
    mode_seen <= (others => '0');
    service_mode <= '0';
end architecture;
